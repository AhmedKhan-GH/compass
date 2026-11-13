library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        channel_a : in std_logic_vector(3 downto 0);
        channel_b : in std_logic_vector(3 downto 0);
        select_b : in std_logic;
        channel : in std_logic_vector(1 downto 0);
        override_active : in std_logic;
        override_data : in std_logic_vector(3 downto 0);
        selected : out std_logic_vector(3 downto 0);
        decoded : out std_logic_vector(3 downto 0);
        priority_selected : out std_logic_vector(3 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    selected <= channel_b when select_b = '1' else channel_a;
    decoded <= (others => '0');
    priority_selected <= (others => '0');
end architecture;
