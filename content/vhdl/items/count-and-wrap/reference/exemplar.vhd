library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
    clk, reset, enable : in std_logic;
    natural_count, six_count : out std_logic_vector(2 downto 0)
    );
end entity;
architecture rtl of top_module is
    signal natural_r, six_r : unsigned(2 downto 0) := (others => '0');
    begin
    natural_count <= std_logic_vector(natural_r);
    six_count <= std_logic_vector(six_r);
    process(clk) begin
        if rising_edge(clk) then
            if reset = '1' then natural_r <= (others => '0');
                six_r <= (others => '0');
            elsif enable = '1' then
                natural_r <= natural_r + 1;
                if six_r = 5 then six_r <= (others => '0');
                else six_r <= six_r + 1;
                end if;
            end if;
        end if;
    end process;
end architecture;
