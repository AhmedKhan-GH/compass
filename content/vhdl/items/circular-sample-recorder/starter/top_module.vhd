library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    generic (
        WIDTH : positive := 8;
        DEPTH : positive := 5;
        ADDR_WIDTH : positive := 3
    );
    port (
        clk, reset, sample_valid : in std_logic;
        sample_data : in std_logic_vector(WIDTH-1 downto 0);
        age : in std_logic_vector(ADDR_WIDTH-1 downto 0);
        sample_out : out std_logic_vector(WIDTH-1 downto 0);
        count : out std_logic_vector(ADDR_WIDTH downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    sample_out <= (others => '0');
    count <= (others => '0'); -- TODO: record, wrap, and retrieve samples by age
end architecture;
